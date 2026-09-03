import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { CategoryModule } from "./categories/category.module";
import { AuthModule } from "./auth/auth.module";
import { TransectionsModule } from "./transections/transections.module";
import { SaveModule } from "./save/save.module";

/**
 * AppModule = MODULE GỐC (root module) của ứng dụng.
 * main.ts gọi NestFactory.create(AppModule) → Nest đọc metadata trong @Module
 * bên dưới để biết phải khởi tạo những gì.
 *
 * @Module có 4 key chính:
 *   imports     → các MODULE KHÁC mà module này cần dùng
 *   controllers → class xử lý HTTP request (đối ngoại)
 *   providers   → class chứa logic, được Nest tự tạo & tiêm (DI)
 *   exports     → provider cho module khác dùng lại (ở đây chưa cần)
 */
@Module({
  imports: [
    // ─────────────────────────────────────────────────────────────────────
    // 1) ConfigModule — ĐỌC BIẾN MÔI TRƯỜNG
    // ─────────────────────────────────────────────────────────────────────
    // Đọc file .env ở thư mục gốc project → nạp vào process.env,
    // đồng thời tạo provider `ConfigService` để đọc giá trị có kiểu.
    //
    // TẠI SAO CẦN: để không hardcode host/password DB vào source code.
    // Máy bạn dùng localhost, server production dùng host khác
    // → chỉ đổi file .env, KHÔNG sửa code. (.env không commit lên git)
    //
    // isGlobal: true → ConfigService dùng được ở MỌI module,
    // không cần từng module phải `imports: [ConfigModule]` lại.
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ─────────────────────────────────────────────────────────────────────
    // 2) TypeOrmModule — MỞ KẾT NỐI DATABASE (PostgreSQL)
    // ─────────────────────────────────────────────────────────────────────
    // Mở SẴN một connection pool dùng chung cho toàn app, ngay lúc bootstrap.
    //
    // VÌ SAO LÀ forRootAsync CHỨ KHÔNG PHẢI forRoot?
    //   forRoot      → nhận object TĨNH, viết cứng ngay tại đây.
    //   forRootAsync → HOÃN việc tạo object config lại, tới khi DI container
    //                  đã tạo xong ConfigService. Vì ta cần đọc config từ DI
    //                  nên buộc phải dùng bản Async.
    //
    // Quy ước tên của Nest cho "dynamic module" (module nhận tham số):
    //   forRoot / forRootAsync → cấu hình toàn cục, gọi 1 lần ở root
    //   forFeature / register  → cấu hình cho từng phần, gọi nhiều lần
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const, // loại DB — cần driver tương ứng (package `pg`)
        host: config.get<string>("DB_HOST", "localhost"),
        port: Number(config.get("DB_PORT", 5432)),
        username: config.get<string>("DB_USERNAME", "postgres"),
        password: config.get<string>("DB_PASSWORD", "postgres"),
        database: config.get<string>("DB_DATABASE", "nestjs_db"),
        autoLoadEntities: true,
        synchronize: true,
        logging: config.get("NODE_ENV") !== "production",
      }),
    }),

    // ─────────────────────────────────────────────────────────────────────
    // 3) Các module nghiệp vụ của mình
    // ─────────────────────────────────────────────────────────────────────
    UsersModule,
    CategoryModule,
    TransectionsModule,
    AuthModule,
    SaveModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
