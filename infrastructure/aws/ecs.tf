resource "aws_ecs_cluster" "main" {
  name = local.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_service_discovery_private_dns_namespace" "internal" {
  name = "${local.name}.internal"
  vpc  = aws_vpc.main.id
}

resource "aws_service_discovery_service" "transport" {
  name = "transport-service"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.internal.id
    dns_records {
      type = "A"
      ttl  = 10
    }
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name}-ecs-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "${local.name}-ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

locals {
  common_log_config = {
    logDriver = "awslogs"
    options = {
      "awslogs-group"         = aws_cloudwatch_log_group.app.name
      "awslogs-region"        = var.aws_region
      "awslogs-stream-prefix" = "ecs"
    }
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "${local.name}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = var.container_images.api
    essential = true
    portMappings = [{ containerPort = 4000 }]
    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.database_url.arn },
      { name = "JWT_ACCESS_SECRET", valueFrom = aws_secretsmanager_secret.jwt_access_secret.arn },
      { name = "JWT_REFRESH_SECRET", valueFrom = aws_secretsmanager_secret.jwt_refresh_secret.arn },
      { name = "RAZORPAY_KEY_SECRET", valueFrom = aws_secretsmanager_secret.razorpay_key_secret.arn },
    ]
    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "REDIS_URL", value = "redis://${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379" },
      { name = "KAFKA_BROKERS", value = aws_msk_serverless_cluster.main.bootstrap_brokers_sasl_iam },
      { name = "TRANSPORT_SERVICE_URL", value = "http://transport-service.${local.name}.internal:4100" },
      { name = "S3_BUCKET_MEDIA", value = aws_s3_bucket.media.bucket },
      { name = "S3_BUCKET_VERIFICATION", value = aws_s3_bucket.verification_documents.bucket },
    ]
    logConfiguration = local.common_log_config
  }])
}

resource "aws_ecs_service" "api" {
  name            = "${local.name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_service.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 4000
  }
}

resource "aws_ecs_task_definition" "transport_service" {
  family                   = "${local.name}-transport"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "transport-service"
    image     = var.container_images.transport_service
    essential = true
    portMappings = [{ containerPort = 4100 }]
    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.database_url.arn },
    ]
    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "KAFKA_BROKERS", value = aws_msk_serverless_cluster.main.bootstrap_brokers_sasl_iam },
    ]
    logConfiguration = local.common_log_config
  }])
}

resource "aws_ecs_service" "transport_service" {
  name            = "${local.name}-transport"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.transport_service.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_service.id]
  }
  service_registries {
    registry_arn = aws_service_discovery_service.transport.arn
  }
}

resource "aws_ecs_task_definition" "web" {
  family                   = "${local.name}-web"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "web"
    image     = var.container_images.web
    essential = true
    portMappings = [{ containerPort = 3000 }]
    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "NEXT_PUBLIC_API_URL", value = "https://${var.domain_name}" },
    ]
    logConfiguration = local.common_log_config
  }])
}

resource "aws_ecs_service" "web" {
  name            = "${local.name}-web"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_service.id]
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 3000
  }
}
