import { TableEditMode, TableEditabilityCheck } from './table-interaction.types';

export class TableEditingStrategy {
  private readonly _defaultMode: TableEditMode;

  constructor(defaultMode: TableEditMode = 'cell') {
    this._defaultMode = defaultMode;
  }

  get defaultMode(): TableEditMode {
    return this._defaultMode;
  }

  canEdit(check: TableEditabilityCheck): boolean {
    if (check.readOnly === true) return false;
    if (check.editMode === 'none') return false;
    return true;
  }

  resolveMode(check: TableEditabilityCheck): TableEditMode {
    if (check.editMode && check.editMode !== 'none') return check.editMode;
    return this._defaultMode;
  }

  shouldCommitOnEnter(): boolean {
    return true;
  }

  shouldCommitOnBlur(): boolean {
    return this._defaultMode === 'cell';
  }

  shouldCommitOnTab(): boolean {
    return this._defaultMode === 'cell';
  }

  shouldCancelOnEscape(): boolean {
    return true;
  }
}
