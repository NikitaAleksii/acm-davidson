"use client";

import { startTransition, useActionState, useCallback, type FormEvent } from "react";

/**
 * Like useActionState, but submits through onSubmit instead of the form
 * `action` prop. React 19 resets uncontrolled fields after a form action
 * finishes, which wipes the user's input whenever the server returns a
 * validation error. Submitting manually inside a transition avoids that.
 * The clicked submit button's name/value is still included.
 */
export function useFormAction<S>(
  action: (prev: Awaited<S>, formData: FormData) => S | Promise<S>,
  initial: Awaited<S>,
) {
  const [state, formAction, pending] = useActionState<S, FormData>(action, initial);
  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
      const formData = new FormData(e.currentTarget, submitter ?? undefined);
      startTransition(() => formAction(formData));
    },
    [formAction],
  );
  return { state, pending, onSubmit };
}
