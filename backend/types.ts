export type X402Response = {
  x402Version: number;
  error?: string;
  accepts?: Array<Accepts>;
  payer?: string;
};

export type Accepts = {
  scheme: "exact";
  network: "base";
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  // Optionally, schema describing the input and output expectations for the paid endpoint.
  outputSchema?: {
    input: {
      type: "http";
      method: "GET" | "POST";
      bodyType?:
        | "json"
        | "form-data"
        | "multipart-form-data"
        | "text"
        | "binary";
      queryParams?: Record<string, FieldDef>;
      bodyFields?: Record<string, FieldDef>;
      headerFields?: Record<string, FieldDef>;
    };
    output?: Record<string, any>;
  };
  // Optionally, additional custom data the provider wants to include.
  extra?: Record<string, any>;
};

export type FieldDef = {
  type?: string;
  required?: boolean | string[];
  description?: string;
  enum?: string[];
  properties?: Record<string, FieldDef>; // for nested objects
};
