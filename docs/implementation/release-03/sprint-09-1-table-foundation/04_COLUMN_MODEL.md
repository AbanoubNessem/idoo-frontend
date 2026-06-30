# Sprint 9.1 — Column Model

## TableColumnDefinition

```typescript
interface TableColumnDefinition {
  readonly id:           string;           // Unique column identifier
  readonly field:        string;           // Data field path (dot-notation supported)
  readonly header:       string;           // Display label
  readonly type:         TableColumnType;  // See types below
  readonly width?:       number | string;
  readonly minWidth?:    number | string;
  readonly maxWidth?:    number | string;
  readonly sortable?:    boolean;          // Default: false
  readonly filterable?:  boolean;          // Default: false
  readonly groupable?:   boolean;          // Default: false
  readonly searchable?:  boolean;          // Default: false
  readonly hideable?:    boolean;          // Default: true
  readonly resizable?:   boolean;          // Default: false
  readonly sticky?:      'start' | 'end' | false; // Default: false
  readonly visible?:     boolean;          // Default: true
  readonly required?:    boolean;          // Default: false
  readonly editable?:    boolean;          // Default: false
  readonly exportable?:  boolean;          // Default: true
  readonly printable?:   boolean;          // Default: true
  readonly permission?:  string | string[];
  readonly formatter?:   TableFormatter;   // (value, row) => string
  readonly renderer?:    string;           // Custom renderer id
  readonly cellClass?:   string | string[] | TableCellClassFn;
  readonly headerClass?: string | string[];
  readonly footerClass?: string | string[];
  readonly order?:       number;
  readonly metadata?:    Record<string, unknown>;
}
```

## Supported Column Types (21)

| Type        | Description                              |
|-------------|------------------------------------------|
| `text`      | Plain string                             |
| `number`    | Numeric value                            |
| `currency`  | Formatted monetary value                 |
| `percentage`| Percentage (0–100 or 0.0–1.0)           |
| `boolean`   | True/false indicator                     |
| `date`      | Date without time                        |
| `datetime`  | Date with time                           |
| `time`      | Time only                                |
| `badge`     | Colored badge/pill                       |
| `chip`      | Chip with label                          |
| `status`    | Status indicator (active / inactive...)  |
| `tag`       | Inline tag                               |
| `avatar`    | User/entity avatar image                 |
| `image`     | General image                            |
| `icon`      | Icon glyph                               |
| `link`      | Hyperlink                                |
| `email`     | Email address (mailto)                   |
| `phone`     | Phone number (tel)                       |
| `progress`  | Progress bar (0–100)                     |
| `rating`    | Star or score rating                     |
| `custom`    | Custom renderer (requires `renderer` id) |

## ResolvedTableColumn

Extends `TableColumnDefinition` with two resolved boolean properties:

```typescript
interface ResolvedTableColumn extends TableColumnDefinition {
  readonly effectiveVisible:  boolean;  // visible ?? true
  readonly effectiveEditable: boolean;  // editable ?? false
}
```

## Column Defaults

| Option        | Default |
|---------------|---------|
| `visible`     | `true`  |
| `sortable`    | `false` |
| `filterable`  | `false` |
| `groupable`   | `false` |
| `searchable`  | `false` |
| `hideable`    | `true`  |
| `resizable`   | `false` |
| `editable`    | `false` |
| `exportable`  | `true`  |
| `printable`   | `true`  |
| `required`    | `false` |
| `sticky`      | `false` |
