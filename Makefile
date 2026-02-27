# Makefile for DtComb Project

.PHONY: help install run test docker-build docker-up docker-down docker-logs clean lint format

help:
	@echo "DtComb - Available Commands:"
	@echo "  make install       - Install Python dependencies"
	@echo "  make run           - Run the application locally"
	@echo "  make test          - Run tests with pytest"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-up     - Start Docker containers"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make docker-logs   - View Docker logs"
	@echo "  make lint          - Run linting checks"
	@echo "  make format        - Format code with black"
	@echo "  make clean         - Clean cache and temporary files"

install:
	pip install -r requirements.txt

run:
	python main.py

test:
	pytest tests/ -v

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-restart:
	docker-compose restart

lint:
	@echo "Running flake8..."
	flake8 app/ --max-line-length=120 --exclude=__pycache__,*.pyc

format:
	@echo "Formatting with black..."
	black app/ main.py --line-length=120

clean:
	@echo "Cleaning cache files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.log" -delete
	find . -type f -name "Rplots.pdf" -delete
	find . -type f -name "temp_*.png" -delete
	@echo "Clean complete!"

setup-env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created from .env.example"; \
		echo "Please edit .env and update the credentials!"; \
	else \
		echo ".env file already exists"; \
	fi

