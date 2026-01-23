#!/bin/bash

# Douyin Toolbox - MCP Server Startup Script
# 自动检测 Python 环境、检查依赖、启动服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_DIR="${SCRIPT_DIR}/../douyin-mcp-server"
REQUIREMENTS_FILE="${MCP_DIR}/requirements.txt"
VENV_DIR="${MCP_DIR}/.venv"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[MCP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[MCP]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[MCP]${NC} $1"
}

log_error() {
    echo -e "${RED}[MCP]${NC} $1"
}

# 检查 Python 是否安装
check_python() {
    log_info "Checking Python environment..."

    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed!"
        log_info "Please install Python 3.8+ from https://python.org"
        exit 1
    fi

    PYTHON_VERSION=$(python3 --version 2>&1)
    log_success "Python found: ${PYTHON_VERSION}"
}

# 检查 pip 是否可用
check_pip() {
    log_info "Checking pip..."

    if ! command -v pip3 &> /dev/null && ! python3 -m pip --version &> /dev/null; then
        log_error "pip is not available!"
        log_info "Please install pip: python3 -m ensurepip"
        exit 1
    fi

    log_success "pip is available"
}

# 检查并安装依赖
check_dependencies() {
    log_info "Checking dependencies..."

    if [ ! -f "${REQUIREMENTS_FILE}" ]; then
        log_error "requirements.txt not found at ${REQUIREMENTS_FILE}"
        exit 1
    fi

    # 使用虚拟环境（如果存在）
    if [ -d "${VENV_DIR}" ]; then
        log_info "Using virtual environment..."
        PYTHON_CMD="${VENV_DIR}/bin/python"
        PIP_CMD="${VENV_DIR}/bin/pip"
    else
        PYTHON_CMD="python3"
        PIP_CMD="pip3"
    fi

    # 检查依赖是否已安装
    log_info "Verifying installed packages..."

    if ${PIP_CMD} list 2>/dev/null | grep -q "fastapi"; then
        log_success "Dependencies already installed"
        return 0
    fi

    log_warn "Dependencies not found or outdated"
    return 1
}

# 安装依赖
install_dependencies() {
    log_info "Installing Python dependencies..."

    # 创建虚拟环境（可选）
    if [ ! -d "${VENV_DIR}" ]; then
        log_info "Creating virtual environment..."
        python3 -m venv "${VENV_DIR}"
        log_success "Virtual environment created at ${VENV_DIR}"
    fi

    # 使用虚拟环境的 pip
    PIP_CMD="${VENV_DIR}/bin/pip"

    # 升级 pip
    log_info "Upgrading pip..."
    ${PIP_CMD} install --upgrade pip --quiet 2>/dev/null || true

    # 安装依赖
    log_info "Installing packages from requirements.txt..."
    ${PIP_CMD} install -r "${REQUIREMENTS_FILE}"

    log_success "Dependencies installed successfully"
}

# 启动 MCP Server
start_server() {
    log_info "Starting MCP Server..."

    # 确定 Python 命令
    if [ -d "${VENV_DIR}" ]; then
        PYTHON_CMD="${VENV_DIR}/bin/python"
    else
        PYTHON_CMD="python3"
    fi

    cd "${MCP_DIR}"

    # 启动服务
    ${PYTHON_CMD} -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload

    log_success "MCP Server stopped"
}

# 主函数
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║           Douyin Toolbox - MCP Server                  ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""

    # 处理参数
    case "${1:-}" in
        --install)
            log_info "Mode: Install dependencies only"
            check_python
            check_pip
            install_dependencies
            log_success "Installation complete!"
            exit 0
            ;;
        --check)
            log_info "Mode: Check environment only"
            check_python
            check_pip
            check_dependencies
            log_success "Environment check passed!"
            exit 0
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --install    Install dependencies only"
            echo "  --check      Check environment only"
            echo "  --help       Show this help message"
            echo ""
            echo "Without options: Start MCP Server"
            exit 0
            ;;
    esac

    # 完整启动流程
    check_python
    check_pip

    if ! check_dependencies; then
        log_warn "Some dependencies are missing"
        read -p "Install dependencies now? [Y/n] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [ -z "$REPLY" ]; then
            install_dependencies
        else
            log_error "Cannot start without dependencies"
            exit 1
        fi
    fi

    # 捕获 Ctrl+C
    trap 'log_warn "Shutting down..."; exit 0' INT TERM

    start_server
}

main "$@"
