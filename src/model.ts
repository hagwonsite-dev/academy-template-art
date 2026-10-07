import type { Config, Field, Entity } from './operations.ts';
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'url' | 'select';
export interface AcademyField extends Field { type: FieldType }
export interface AcademyEntity extends Entity {
 layout: 'table' | 'cards' | 'schedule' | 'board' | 'gallery';
 fields: AcademyField[];
}
export interface AcademyConfig extends Config {
 entities: Record<string, AcademyEntity>;
 tagline: string; description: string; eyebrow: string; accent: string; tint: string;
}
export type Scalar = string | number | null;
export interface Row { id: string; [field: string]: Scalar }
export interface PageData { rows: Row[]; total: number; page: number; pageSize: number }
export interface Overview { metrics: { label: string; value: number }[]; records: PageData }
export interface ListParams { page?: number; q?: string; status?: string; studentId?: string }
export interface Option { id: string; label: string }
export interface OptionsPage { options: Option[]; hasMore: boolean }
export function isRecord(value: unknown): value is Record<string, unknown> {
 return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function parseOptions(value: unknown): OptionsPage {
 if (!isRecord(value) || !Array.isArray(value.options) || typeof value.hasMore !== 'boolean') throw Error('선택 목록 응답을 확인하세요');
 const options = value.options.map((item: unknown) => {
  if (!isRecord(item) || typeof item.id !== 'string' || typeof item.label !== 'string') throw Error('선택 목록 응답을 확인하세요');
  return {id:item.id,label:item.label};
 });
 return {options,hasMore:value.hasMore};
}
