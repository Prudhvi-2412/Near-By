import { IsString } from 'class-validator';

export class AttachDocumentDto {
  @IsString()
  key!: string;

  @IsString()
  fileType!: string;
}
