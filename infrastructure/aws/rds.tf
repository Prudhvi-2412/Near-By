resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "postgres" {
  identifier                  = "${local.name}-postgres"
  engine                      = "postgres"
  engine_version              = "16"
  instance_class              = var.db_instance_class
  allocated_storage           = 50
  max_allocated_storage       = 200
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = "nearby"
  username                    = "nearby"
  manage_master_user_password = true # rotated automatically via Secrets Manager
  db_subnet_group_name        = aws_db_subnet_group.main.name
  vpc_security_group_ids      = [aws_security_group.data_tier.id]
  multi_az                    = true
  backup_retention_period     = 7
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${local.name}-postgres-final"
}
