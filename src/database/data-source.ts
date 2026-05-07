import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import 'dotenv/config';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  // host: process.env.DB_HOST,
  // port: Number(process.env.DB_PORT),
  // username: process.env.DB_USERNAME,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME,
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  logging: true,
  ssl: {
    rejectUnauthorized: false,
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);
