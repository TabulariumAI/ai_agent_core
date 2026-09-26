import { IsOptional, IsNumberString, ValidateIf, IsNotEmpty, IsString } from "class-validator";
import { Expose } from 'class-transformer';

import * as Entities from "../../core/entities/imports"

export class SessionQueryParams {
    @Expose({ name: 'sn' })
    @IsNotEmpty({ message: 'Session (sn) is required' })
    @IsString()
    session!: string;

    @Expose({ name: 'bt' })
    @IsString()
    @ValidateIf(o => o.task !== undefined || o.batch !== undefined)
    @IsNotEmpty({ message: 'Batch (bt) and Task (tk) are required together' })
    batch?: string;

    @Expose({ name: 'tk' })
    @IsString()
    @ValidateIf(o => o.task !== undefined || o.batch !== undefined)
    @IsNotEmpty({ message: 'Batch (bt) and Task (tk) are required together' })
    task?: string;

    toSession(): Entities.SessionCallbackData {
        if (!this.session) {
            throw new Error('Session (sn) is required');
        }
        if (!this.batch || !this.task) {
            return new Entities.SessionCallbackData(this.session);
        }
        return new Entities.SessionCallbackData(this.session, {id: this.task, batch: this.batch});
    }

}
