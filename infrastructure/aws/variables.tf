variable "project" {
  description = "Project name, used as a prefix for all resources."
  type        = string
  default     = "near-by"
}

variable "environment" {
  description = "Deployment environment name (e.g. staging, production)."
  type        = string
  default     = "production"
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.medium"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.small"
}

variable "domain_name" {
  description = "Public domain the CloudFront distribution serves (e.g. nearby.app)."
  type        = string
  default     = "nearby.example.com"
}

variable "container_images" {
  description = "ECR image URIs for each service, populated by CI after a successful build."
  type = object({
    api               = string
    transport_service = string
    web               = string
  })
}
