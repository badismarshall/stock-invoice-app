"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { UserDTOItem } from "@/data/user/user.dto";
// import {
//   SignUpFormValues,
//   signUpSchema,
// } from "@/app/(auth)/_lib/authform.schema";

import { updateUser } from "../../_lib/actions";
import { type UpdateUserSchema, getUpdateUserSchema } from "../../_lib/update-user.schemas";
import { UserForm } from "../update-user-form";

interface UpdateUserSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  user: UserDTOItem | null;
}

export function UpdateUserSheet({ user, ...props }: UpdateUserSheetProps) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<UpdateUserSchema>({
    resolver: zodResolver(getUpdateUserSchema()),
    defaultValues: {
      firstName: user?.name?.split(" ")[0] ?? "",   
      lastName: user?.name?.split(" ")[1] ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "",
      emailVerified: user?.emailVerified ?? false,
    },
  });

  function onSubmit(input: UpdateUserSchema) {
    startTransition(async () => {
      if (!user) return;

      const { error } = await updateUser({
        id: user.id,
        ...input,
      });

      if (error) {
        toast.error(error);
        return;
      }

      form.reset(input);
      props.onOpenChange?.(false);
      toast.success("User updated");
    });
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Update user</SheetTitle>
          <SheetDescription>
            Update the user details and save the changes
          </SheetDescription>
        </SheetHeader>
        <UserForm<UpdateUserSchema> form={form} onSubmit={onSubmit}>
          <SheetFooter className="gap-2 pt-2 sm:space-x-0">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetClose>
            <Button disabled={isPending}>
              {isPending && (
                <Loader
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              Save
            </Button>
          </SheetFooter>
        </UserForm>
      </SheetContent>
    </Sheet>
  );
}