"use client"

import { Calendar, Milestone } from "lucide-react"

interface PaymentModel {
  monthly_enabled: boolean
  monthly_amount?: number | null
  monthly_due_day?: number | null
  milestone_based_enabled: boolean
  milestone_amount?: number | null
}

export function ShareholderPaymentModelCard({ model }: { model: PaymentModel | null }) {
  if (!model || (!model.monthly_enabled && !model.milestone_based_enabled)) {
    return (
      <div className="p-6 rounded-[1.25rem] border border-outline-variant/40 bg-surface">
        <h2 className="text-[16px] font-semibold text-on-surface mb-1">Payment Model</h2>
        <p className="text-sm text-on-surface-variant">No payment model has been configured for your account yet. Your project admin will set this up.</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-[1.25rem] border border-outline-variant/40 bg-surface space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-on-surface">Payment Model</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">How your scheduled payments are structured for this project.</p>
      </div>

      <div className="space-y-3">
        {model.monthly_enabled && (
          <div className="flex items-start gap-3 rounded-xl bg-primary-container/20 border border-primary-container/40 px-4 py-3">
            <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Monthly Fixed Amount</p>
              <p className="text-sm text-on-surface font-medium mt-0.5">
                ৳{Number(model.monthly_amount ?? 0).toLocaleString("en-IN")} &mdash; due on day{" "}
                <strong>{model.monthly_due_day}</strong> of each month
              </p>
            </div>
          </div>
        )}

        {model.milestone_based_enabled && (
          <div className="flex items-start gap-3 rounded-xl bg-tertiary-container/20 border border-tertiary-container/40 px-4 py-3">
            <Milestone className="h-4 w-4 text-tertiary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-tertiary uppercase tracking-wide">Milestone Based</p>
              <p className="text-sm text-on-surface font-medium mt-0.5">
                {model.milestone_amount
                  ? `৳${Number(model.milestone_amount).toLocaleString("en-IN")} per milestone`
                  : "Payment amount set per milestone by your project admin"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
