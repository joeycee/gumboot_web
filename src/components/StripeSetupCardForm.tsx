"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { createCardSetupIntent, setDefaultSavedCard } from "@/lib/payments";
import { ApiError } from "@/lib/api";
import { stripePromise } from "@/lib/stripe";

type InnerProps = {
  buttonLabel: string;
  makeDefaultOnSuccess?: boolean;
  onSuccess?: (paymentMethodId: string) => Promise<void> | void;
  onError?: (message: string) => void;
};

function InnerSetupCardForm({ buttonLabel, makeDefaultOnSuccess = false, onSuccess, onError }: InnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) return;

    setSaving(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message || "Unable to validate your card details.");
      }

      const result = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Unable to save your card.");
      }

      const paymentMethodId =
        typeof result.setupIntent?.payment_method === "string"
          ? result.setupIntent.payment_method
          : result.setupIntent?.payment_method?.id;

      if (!paymentMethodId) {
        throw new Error("Stripe did not return a payment method.");
      }

      if (makeDefaultOnSuccess) {
        await setDefaultSavedCard(paymentMethodId);
      }

      await onSuccess?.(paymentMethodId);
    } catch (nextError) {
      const message =
        nextError instanceof ApiError || nextError instanceof Error
          ? nextError.message
          : "Unable to save your card.";
      setError(message);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  }, [elements, makeDefaultOnSuccess, onError, onSuccess, stripe]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <PaymentElement
        options={{
          layout: "accordion",
        }}
      />
      {error ? (
        <div style={{ fontSize: 13, color: "rgba(255,220,220,0.92)", lineHeight: 1.5 }}>{error}</div>
      ) : null}
      <button type="button" onClick={handleSubmit} disabled={!stripe || !elements || saving}>
        {saving ? "Saving…" : buttonLabel}
      </button>
    </div>
  );
}

type StripeSetupCardFormProps = {
  buttonLabel: string;
  className?: string;
  makeDefaultOnSuccess?: boolean;
  onSuccess?: (paymentMethodId: string) => Promise<void> | void;
  onError?: (message: string) => void;
  resetKey?: string | number;
};

export function StripeSetupCardForm({
  buttonLabel,
  className,
  makeDefaultOnSuccess = false,
  onSuccess,
  onError,
  resetKey,
}: StripeSetupCardFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIntent = useCallback(async () => {
    if (!stripePromise) {
      setError("Stripe is not configured for this environment.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await createCardSetupIntent();
      if (!response.body?.clientSecret) {
        throw new Error("Missing Stripe client secret.");
      }
      setClientSecret(response.body.clientSecret);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to prepare the secure card form.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIntent();
  }, [loadIntent, resetKey]);

  const options = useMemo<StripeElementsOptions | undefined>(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret,
      appearance: {
        theme: "night",
        variables: {
          colorPrimary: "#26A69A",
          colorBackground: "#2A3439",
          colorText: "#E5E5E5",
          colorDanger: "#f5c4c4",
        },
      },
    };
  }, [clientSecret]);

  if (loading) {
    return <div className={className}>Loading secure card form…</div>;
  }

  if (error || !clientSecret || !stripePromise || !options) {
    return <div className={className}>{error || "Stripe is not configured for this environment."}</div>;
  }

  return (
    <div className={className}>
      <Elements stripe={stripePromise} options={options}>
        <InnerSetupCardForm
          buttonLabel={buttonLabel}
          makeDefaultOnSuccess={makeDefaultOnSuccess}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
}
