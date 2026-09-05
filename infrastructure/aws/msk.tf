resource "aws_msk_serverless_cluster" "main" {
  cluster_name = "${local.name}-kafka"

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.data_tier.id]
  }

  client_authentication {
    sasl {
      iam {
        enabled = true
      }
    }
  }
}
