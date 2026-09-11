import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CasesModule } from './modules/cases/cases.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { JurisprudenceModule } from './modules/jurisprudence/jurisprudence.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { ChatModule } from './modules/chat/chat.module';
import { GenerationModule } from './modules/generation/generation.module';
import { AuditModule } from './modules/audit/audit.module';
import { LegislationModule } from './modules/legislation/legislation.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { NewsModule } from './modules/news/news.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: false }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRATION', '24h') },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CasesModule,
    DocumentsModule,
    JurisprudenceModule,
    AnalysisModule,
    ChatModule,
    GenerationModule,
    AuditModule,
    LegislationModule,
    TemplatesModule,
    IntegrationsModule,
    NewsModule,
  ],
})
export class AppModule {}
