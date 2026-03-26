import { Module } from "@nestjs/common";
import { KmsEncryptionService } from "./kms-encryption.service";

@Module({
    providers: [KmsEncryptionService],
    exports: [KmsEncryptionService]
})
export class KmsEncryptionModule {}