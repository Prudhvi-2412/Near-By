output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.web.domain_name
}

output "rds_endpoint" {
  value     = aws_db_instance.postgres.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "msk_bootstrap_brokers" {
  value = aws_msk_serverless_cluster.main.bootstrap_brokers_sasl_iam
}

output "media_bucket" {
  value = aws_s3_bucket.media.bucket
}

output "verification_bucket" {
  value = aws_s3_bucket.verification_documents.bucket
}
