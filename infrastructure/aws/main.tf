# Near By — reference AWS infrastructure (Terraform).
#
# This is a deployment REFERENCE, not applied infrastructure — no AWS account
# is provisioned from this repository. It documents exactly how the topology
# in docs/aws-deployment.md maps to real resources so a team can run
# `terraform apply` against their own AWS account when ready.
#
# Suggested remote state (uncomment and fill in before first use):
# terraform {
#   backend "s3" {
#     bucket         = "near-by-terraform-state"
#     key            = "near-by/production.tfstate"
#     region         = "ap-south-1"
#     dynamodb_table = "near-by-terraform-locks"
#     encrypt        = true
#   }
# }

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name = "${var.project}-${var.environment}"
}
