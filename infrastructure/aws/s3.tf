resource "aws_s3_bucket" "media" {
  bucket = "${local.name}-media"
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# Media is served through CloudFront, not read directly from S3 — this policy
# only allows CloudFront's origin access control to fetch objects.
resource "aws_s3_bucket_policy" "media_cloudfront" {
  bucket = aws_s3_bucket.media.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipal"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.media.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.web.arn }
      }
    }]
  })
}

resource "aws_s3_bucket" "verification_documents" {
  bucket = "${local.name}-verification-docs"
}

resource "aws_s3_bucket_public_access_block" "verification_documents" {
  bucket                  = aws_s3_bucket.verification_documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "verification_documents" {
  bucket = aws_s3_bucket.verification_documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}
