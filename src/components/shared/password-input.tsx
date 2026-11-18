"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "className"
> & {
  className?: string;
};

export function PasswordInput({
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className={`pr-11 ${className ?? ""}`}
        type={visible ? "text" : "password"}
        {...props}
      />
      <Button
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
        onClick={() => setVisible((current) => !current)}
        size="icon"
        type="button"
        variant="ghost"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}
