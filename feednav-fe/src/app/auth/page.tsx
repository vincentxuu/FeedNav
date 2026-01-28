"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthSession } from '@/hooks/useAuthSession';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  email: z.string().email({ message: '請輸入有效的電子郵件地址' }),
  password: z.string().min(6, { message: '密碼長度至少需要 6 個字元' }),
});

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login, register } = useAuthSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await register(values.email, values.password);
        if (result.success) {
          toast({
            title: '註冊成功',
            description: '帳號已建立，您已自動登入。',
          });
          router.push('/');
        } else {
          toast({
            title: '註冊失敗',
            description: result.error || '註冊時發生錯誤',
            variant: 'destructive',
          });
        }
      } else {
        const result = await login(values.email, values.password);
        if (result.success) {
          toast({
            title: '登入成功',
          });
          router.push('/');
        } else {
          toast({
            title: '登入失敗',
            description: result.error || '登入時發生錯誤',
            variant: 'destructive',
          });
        }
      }
    } catch {
      toast({
        title: isSignUp ? '註冊失敗' : '登入失敗',
        description: '發生未預期的錯誤，請稍後再試。',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{isSignUp ? '建立新帳號' : '登入您的帳號'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電子郵件</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密碼</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '處理中...' : isSignUp ? '註冊' : '登入'}
              </Button>
            </form>
          </Form>

          <div className="mt-4 space-y-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或使用</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => apiClient.loginWithGoogle()}
              disabled={isLoading}
            >
              使用 Google 登入
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => apiClient.loginWithDiscord()}
              disabled={isLoading}
            >
              使用 Discord 登入
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            {isSignUp ? '已經有帳號了？' : '還沒有帳號嗎？'}
            <Button variant="link" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? '登入' : '註冊'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
