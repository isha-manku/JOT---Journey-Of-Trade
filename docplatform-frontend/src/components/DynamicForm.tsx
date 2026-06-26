import { Controller, useForm } from "react-hook-form";
import {
  TextField, MenuItem, FormControlLabel, Checkbox, Button, Stack, Grid
} from "@mui/material";
import type { DocumentSchema, SchemaField } from "../types";

interface Props {
  schema: DocumentSchema;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
  onSubmit: (values: Record<string, unknown>) => void;
  busy?: boolean;
}

/** Renders a form entirely from the schema definition. */
export default function DynamicForm({
  schema, defaultValues = {}, submitLabel = "Generate", onSubmit, busy,
}: Props) {
  const initial = Object.fromEntries(
    schema.fields.map(f => [
      f.key,
      defaultValues[f.key] ?? f.default_value ?? (f.field_type === "checkbox" ? false : ""),
    ]),
  );
  const { control, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial });

  const renderField = (f: SchemaField) => (
    <Controller
      key={f.id}
      name={f.key}
      control={control}
      rules={{ required: f.required ? `${f.label} is required` : false }}
      render={({ field }) => {
        const err = !!errors[f.key];
        const helper = (errors[f.key]?.message as string) ?? "";
        switch (f.field_type) {
          case "dropdown":
            return (
              <TextField select label={f.label} {...field} error={err} helperText={helper} fullWidth>
                {(f.options ?? []).map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
            );
          case "textarea":
            return <TextField label={f.label} {...field} error={err} helperText={helper}
              multiline minRows={3} fullWidth placeholder={f.placeholder ?? ""} />;
          case "checkbox":
            return (
              <FormControlLabel
                control={<Checkbox checked={!!field.value}
                  onChange={e => field.onChange(e.target.checked)} />}
                label={f.label}
              />
            );
          case "number":
            return <TextField type="number" label={f.label} {...field} error={err}
              helperText={helper} fullWidth />;
          case "date":
            return <TextField type="date" label={f.label} {...field} error={err}
              helperText={helper} fullWidth InputLabelProps={{ shrink: true }} />;
          default:
            return <TextField label={f.label} {...field} error={err} helperText={helper}
              fullWidth placeholder={f.placeholder ?? ""} />;
        }
      }}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        {[...schema.fields].sort((a, b) => a.order - b.order).map(f => (
          <Grid item xs={12} sm={f.field_type === "textarea" ? 12 : 6} key={f.id}>
            {renderField(f)}
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={busy} size="large" fullWidth>
            {busy ? "Working…" : submitLabel}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
