"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  facilityId: string;
}

export function RequestInfoModal({
  isOpen,
  onClose,
  facilityName,
  facilityId,
}: RequestInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    timeline: "1-3 months",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/request-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          facilityId,
          facilityName,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        // Reset form after 2 seconds and close
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            phone: "",
            message: "",
            timeline: "1-3 months",
          });
          setSubmitted(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 text-6xl">✅</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Request Sent!
            </h3>
            <p className="text-gray-600">
              We&apos;ll send your information to {facilityName} and they&apos;ll contact you within 24-48 hours.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Request Information
          </DialogTitle>
          <DialogDescription>
            Get more details about {facilityName}. They&apos;ll contact you directly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="John Smith"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(555) 123-4567"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="timeline">When are you looking to move in?</Label>
            <select
              id="timeline"
              value={formData.timeline}
              onChange={(e) =>
                setFormData({ ...formData, timeline: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="Immediately">Immediately (within 1 week)</option>
              <option value="1-3 months">1-3 months</option>
              <option value="3-6 months">3-6 months</option>
              <option value="6+ months">6+ months</option>
              <option value="Just researching">Just researching</option>
            </select>
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Any specific questions or needs?"
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            By submitting this form, you agree to be contacted by the facility
            and Nonnie World about your inquiry.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
