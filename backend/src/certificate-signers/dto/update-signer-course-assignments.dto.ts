import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class UpdateSignerCourseAssignmentsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  courseIds!: string[];
}
