'use client';

import { useState } from 'react';
import { Button, Card, Input, Label, Textarea } from '@near-by/ui';
import { FadeIn } from '../../../components/motion/fade-in';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="container flex max-w-xl flex-col items-center py-20">
      <FadeIn className="w-full">
        <p className="text-center text-xs uppercase tracking-widest text-gold-400/80">Contact</p>
        <h1 className="mt-2 text-center font-display text-4xl text-cream-50">We&apos;re here to help</h1>

        <Card className="mt-10 p-8">
          {sent ? (
            <p className="text-center text-cream-200">
              Thanks for reaching out — our team will get back to you within 24 hours.
            </p>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" className="mt-2" required />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" className="mt-2" rows={5} required />
              </div>
              <Button type="submit" className="w-full">
                Send message
              </Button>
            </form>
          )}
        </Card>
      </FadeIn>
    </div>
  );
}
