// src/components/shared/FormSubmitButton.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type FormSubmitButtonProps = ButtonProps & {
  children: React.ReactNode;
};

/**
 * A submit button for forms that displays a loading state while the form is pending.
 * It uses the `useFormStatus` hook to react to the form's submission status.
 */
export default function FormSubmitButton({ children, ...props }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Aguarde...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
