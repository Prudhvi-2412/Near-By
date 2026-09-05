import { IsString } from 'class-validator';

export class VerificationUploadUrlDto {
  @IsString()
  contentType!: string;
}
