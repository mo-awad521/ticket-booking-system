import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailTemplateService {
  private readonly cache = new Map<string, HandlebarsTemplateDelegate>();

  private load(name: string): HandlebarsTemplateDelegate {
    if (this.cache.has(name)) return this.cache.get(name)!;

    const filePath = path.join(__dirname, '..', 'templates', `${name}.hbs`);
    const source = fs.readFileSync(filePath, 'utf8');
    const compiled = Handlebars.compile(source);

    this.cache.set(name, compiled);
    return compiled;
  }

  render(templateName: string, context: Record<string, unknown>): string {
    return this.load(templateName)(context);
  }
}
