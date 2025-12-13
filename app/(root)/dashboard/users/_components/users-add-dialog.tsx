"use client"

import * as React from "react"
import { useState } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, Save, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { roles } from './data-table/users-data-options'
import { type User } from '@/db/schema'
import {
  SignUpFormValues,
  signUpSchema,
} from "@/app/(auth)/_lib/authform.schema";
import { SignUpUserForm } from "@/app/(auth)/sign-up/_components/user-signup-form"
import { AddUserForm } from "./add-user-form"

interface UsersAddDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  currentRow?: User
}

export function UsersAddDialog({
  currentRow,
}: UsersAddDialogProps) {
  const isEdit = !!currentRow


  // NOTE: Edit your form schema below as needed.
  // const form = useForm<SignUpFormValues>({
  //   resolver: zodResolver(signUpSchema),
  //   defaultValues: isEdit
  //     ? {
  //         username: '',
  //         email: currentRow?.email || '',
  //         password: '',
  //         password_confirmation: '',
  //       }
  //     : {
  //         username: '',
  //         email: '',
  //         password: '',
  //         password_confirmation: '',
  //       },
  // })

  // const onSubmit = (values: SignUpFormValues) => {
  //   // form.reset()
  //   console.log('Form submitted:', values)
  // }

  // const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='space-x-1'
        >
          <UserPlus size={18} /> {isEdit ? 'Modifier utilisateur' : 'Ajouter utilisateur'}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <UserPlus /> {isEdit ? 'Modifier utilisateur' : 'Ajouter nouvel utilisateur'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez l'utilisateur ici." : "Créez un nouvel utilisateur ici."}
            Cliquez sur enregistrer lorsque vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        {/* <Form {...form}>
          <form
            id='user-add-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: jean_dupond"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='ex: jean.dupont@email.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder='ex: S3cur3P@ssw0rd'
                        type={showPassword ? "text" : "password"}
                        autoCapitalize="none"
                        autoCorrect="off"
                        {...field}
                      />
                      <Button 
                        className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        size="icon"
                        type="button"
                        variant="ghost"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="size-4 text-muted-foreground" /> 
                          : <Eye className="size-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password_confirmation'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation du mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        disabled={!isPasswordTouched}
                        placeholder='Répétez le mot de passe'
                        type={showConfirmPassword ? "text" : "password"}
                        autoCapitalize="none"
                        autoCorrect="off"
                        {...field}
                      />
                      <Button 
                        className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        size="icon"
                        type="button"
                        variant="ghost"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4 text-muted-foreground" /> 
                          : <Eye className="size-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form> */}
        <AddUserForm />
        {/* <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>Annuler</Button>
          </DialogClose>
          <Button type='submit' form='user-add-form'>
            <Save /> Enregistrer
          </Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
}
