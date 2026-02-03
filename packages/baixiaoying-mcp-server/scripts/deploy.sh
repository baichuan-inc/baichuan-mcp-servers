#!/bin/bash

# ========================================================
# 百小应 MCP Server 部署脚本
# 支持本地部署和推送到阿里云镜像仓库
# ========================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 默认配置
IMAGE_NAME="baixiaoying-mcp-server"
IMAGE_TAG="${IMAGE_TAG:-latest}"
MCP_MODE="${MCP_MODE:-hybrid}"
MCP_PORT="${MCP_PORT:-8787}"

# 阿里云配置（从环境变量读取）
ALIYUN_USERNAME="${ALIYUN_USERNAME:-}"
ALIYUN_PASSWORD="${ALIYUN_PASSWORD:-}"
REGISTRY="${REGISTRY:-}"
NAMESPACE="${NAMESPACE:-}"

# 获取脚本所在目录（packages/baixiaoying-mcp-server/scripts）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 项目根目录（baichuan-mcp-servers）
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
# 包目录
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 显示帮助信息
show_help() {
    cat << EOF
百小应 MCP Server 部署脚本

用法:
  $0 <command> [options]

命令:
  local       本地构建并运行容器（使用 Monorepo 模式）
  remote      构建并推送镜像到阿里云 Registry（使用 Monorepo 模式）
  build       仅构建镜像（不运行/推送）
  stop        停止本地运行的容器
  logs        查看容器日志
  help        显示此帮助信息

选项:
  --tag, -t <tag>       镜像标签（默认: latest）
  --mode, -m <mode>     MCP 运行模式: sse, http, hybrid（默认: hybrid）
  --port, -p <port>     监听端口（默认: 8787）
  --standalone          使用独立构建模式（在包目录内构建，用于 CI/CD）
  --no-cache            构建时不使用缓存

环境变量（remote 命令需要）:
  ALIYUN_USERNAME       阿里云 Registry 用户名
  ALIYUN_PASSWORD       阿里云 Registry 密码
  REGISTRY              镜像仓库地址
  NAMESPACE             命名空间

Dockerfile 说明:
  Dockerfile          独立构建（CI/CD 使用），在包目录内执行 docker build
  Dockerfile.monorepo Monorepo 构建（本地使用），在项目根目录执行 docker build

示例:
  # 本地构建并运行（Monorepo 模式）
  $0 local

  # 使用独立模式构建（CI/CD 场景）
  $0 build --standalone --tag v0.1.0

  # 使用指定标签构建并推送到阿里云
  $0 remote --tag v0.1.0

  # 指定 SSE 模式运行
  $0 local --mode sse --port 8787

EOF
}

# 检查 Docker 是否可用
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装或未在 PATH 中"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon 未运行，请先启动 Docker"
        exit 1
    fi
    
    log_success "Docker 检查通过"
}

# 检查阿里云配置
check_aliyun_config() {
    local missing=()
    
    [[ -z "$ALIYUN_USERNAME" ]] && missing+=("ALIYUN_USERNAME")
    [[ -z "$ALIYUN_PASSWORD" ]] && missing+=("ALIYUN_PASSWORD")
    [[ -z "$REGISTRY" ]] && missing+=("REGISTRY")
    [[ -z "$NAMESPACE" ]] && missing+=("NAMESPACE")
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "缺少必要的环境变量: ${missing[*]}"
        log_info "请在 .env 文件中配置或导出这些环境变量"
        exit 1
    fi
    
    log_success "阿里云配置检查通过"
}

# 加载 .env 文件
load_env() {
    local env_file="$PROJECT_ROOT/.env"
    
    if [[ -f "$env_file" ]]; then
        log_info "加载环境变量: $env_file"
        set -a
        source "$env_file"
        set +a
    else
        log_warn ".env 文件不存在: $env_file"
    fi
}

# 构建 Docker 镜像
# 参数1: no_cache (true/false)
# 参数2: mode (monorepo/standalone)，默认 monorepo
build_image() {
    local no_cache="${1:-false}"
    local build_mode="${2:-monorepo}"
    local local_tag="$IMAGE_NAME:$IMAGE_TAG"
    
    log_info "开始构建 Docker 镜像..."
    log_info "  镜像名称: $local_tag"
    log_info "  构建模式: $build_mode"
    
    local build_args=""
    if [[ "$no_cache" == "true" ]]; then
        build_args="--no-cache"
    fi
    
    if [[ "$build_mode" == "monorepo" ]]; then
        # Monorepo 模式：在根目录构建，使用 Dockerfile.monorepo
        log_info "  构建上下文: $PROJECT_ROOT"
        cd "$PROJECT_ROOT"
        docker build \
            $build_args \
            -f packages/baixiaoying-mcp-server/Dockerfile.monorepo \
            -t "$local_tag" \
            .
    else
        # 独立模式：在包目录构建，使用 Dockerfile
        log_info "  构建上下文: $PACKAGE_DIR"
        cd "$PACKAGE_DIR"
        docker build \
            $build_args \
            -t "$local_tag" \
            .
    fi
    
    log_success "镜像构建完成: $local_tag"
}

# 本地运行容器
run_local() {
    local container_name="$IMAGE_NAME"
    local local_tag="$IMAGE_NAME:$IMAGE_TAG"
    
    # 检查是否已有同名容器在运行
    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_warn "发现已存在的容器: $container_name"
        log_info "正在停止并删除..."
        docker stop "$container_name" 2>/dev/null || true
        docker rm "$container_name" 2>/dev/null || true
    fi
    
    log_info "启动容器..."
    log_info "  容器名称: $container_name"
    log_info "  运行模式: $MCP_MODE"
    log_info "  监听端口: $MCP_PORT"
    
    # 读取 BAICHUAN_API_KEY
    local api_key="${BAICHUAN_API_KEY:-}"
    if [[ -z "$api_key" ]]; then
        log_warn "BAICHUAN_API_KEY 未设置，工具将无法正常工作"
    fi
    
    docker run -d \
        --name "$container_name" \
        -p "$MCP_PORT:8787" \
        -e "MCP_MODE=$MCP_MODE" \
        -e "BAICHUAN_API_KEY=$api_key" \
        -e "BAICHUAN_TIMEOUT_MS=${BAICHUAN_TIMEOUT_MS:-120000}" \
        --restart unless-stopped \
        "$local_tag"
    
    log_success "容器启动成功！"
    echo ""
    log_info "访问地址:"
    if [[ "$MCP_MODE" == "hybrid" ]]; then
        log_info "  Streamable HTTP: http://localhost:$MCP_PORT/mcp"
        log_info "  Legacy SSE:      http://localhost:$MCP_PORT/sse"
    elif [[ "$MCP_MODE" == "sse" ]]; then
        log_info "  Legacy SSE: http://localhost:$MCP_PORT/sse"
    else
        log_info "  Streamable HTTP: http://localhost:$MCP_PORT/mcp"
    fi
    echo ""
    log_info "Cursor 配置示例:"
    echo '  {
    "mcpServers": {
      "baixiaoying": {
        "type": "sse",
        "url": "http://localhost:'$MCP_PORT'/sse"
      }
    }
  }'
    echo ""
    log_info "查看日志: $0 logs"
}

# 推送到阿里云 Registry
push_remote() {
    local local_tag="$IMAGE_NAME:$IMAGE_TAG"
    local remote_tag="$REGISTRY/$NAMESPACE/$IMAGE_NAME:$IMAGE_TAG"
    
    log_info "登录阿里云 Registry..."
    echo "$ALIYUN_PASSWORD" | docker login --username="$ALIYUN_USERNAME" --password-stdin "$REGISTRY"
    
    log_info "标记镜像..."
    docker tag "$local_tag" "$remote_tag"
    
    log_info "推送镜像到阿里云..."
    log_info "  目标: $remote_tag"
    docker push "$remote_tag"
    
    log_success "镜像推送完成！"
    echo ""
    log_info "镜像地址: $remote_tag"
    log_info ""
    log_info "在远程服务器上拉取并运行:"
    echo "  docker login --username='$ALIYUN_USERNAME' $REGISTRY"
    echo "  docker pull $remote_tag"
    echo "  docker run -d \\"
    echo "    --name baixiaoying-mcp-server \\"
    echo "    -p 8787:8787 \\"
    echo "    -e BAICHUAN_API_KEY=your-api-key \\"
    echo "    -e MCP_MODE=hybrid \\"
    echo "    --restart unless-stopped \\"
    echo "    $remote_tag"
}

# 停止容器
stop_container() {
    local container_name="$IMAGE_NAME"
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_info "停止容器: $container_name"
        docker stop "$container_name"
        docker rm "$container_name"
        log_success "容器已停止并删除"
    else
        log_warn "容器未运行: $container_name"
    fi
}

# 查看容器日志
show_logs() {
    local container_name="$IMAGE_NAME"
    
    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        docker logs -f "$container_name"
    else
        log_error "容器未运行: $container_name"
        exit 1
    fi
}

# 解析命令行参数（直接修改全局变量）
parse_args() {
    NO_CACHE=false
    BUILD_MODE=monorepo
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --)
                # 跳过 pnpm 传递的 -- 分隔符
                shift
                ;;
            --tag|-t)
                IMAGE_TAG="$2"
                shift 2
                ;;
            --mode|-m)
                MCP_MODE="$2"
                shift 2
                ;;
            --port|-p)
                MCP_PORT="$2"
                shift 2
                ;;
            --standalone)
                BUILD_MODE=standalone
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
}

# 主函数
main() {
    local command="${1:-help}"
    shift || true
    
    # 加载环境变量
    load_env
    
    # 解析参数（直接修改全局变量）
    parse_args "$@"
    
    case "$command" in
        local)
            check_docker
            build_image "$NO_CACHE" "$BUILD_MODE"
            run_local
            ;;
        remote)
            check_docker
            check_aliyun_config
            build_image "$NO_CACHE" "$BUILD_MODE"
            push_remote
            ;;
        build)
            check_docker
            build_image "$NO_CACHE" "$BUILD_MODE"
            ;;
        stop)
            check_docker
            stop_container
            ;;
        logs)
            check_docker
            show_logs
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
