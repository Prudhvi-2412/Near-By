resource "aws_secretsmanager_secret" "database_url" {
  name = "${local.name}/database-url"
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql://nearby:CHANGE_ME@${aws_db_instance.postgres.endpoint}/nearby?schema=public"

  lifecycle {
    ignore_changes = [secret_string] # rotate out-of-band, don't let terraform overwrite a rotated secret
  }
}

resource "aws_secretsmanager_secret" "jwt_access_secret" {
  name = "${local.name}/jwt-access-secret"
}

resource "aws_secretsmanager_secret" "jwt_refresh_secret" {
  name = "${local.name}/jwt-refresh-secret"
}

resource "aws_secretsmanager_secret" "razorpay_key_secret" {
  name = "${local.name}/razorpay-key-secret"
}
