import pluralize from "pluralize";
import {Schemas} from '@/lib/db/types/schemas';

export function getCollectionName(schemaName: Schemas): string {
  return pluralize(schemaName.toLowerCase())
}
