// apps/marketplace/src/messages/demoData.ts
// Seed demo conversations and messages for the messaging system

import type { Conversation, Message, ContextRef, Participant } from "./types";
import { generateId } from "./types";
import * as store from "./store";

const DEMO_CONVERSATIONS_KEY = "bhq_marketplace_demo_convs_seeded";

/**
 * Demo reply templates for generating realistic responses
 */
const DEMO_REPLIES = [
  "Thanks for reaching out! I'd be happy to tell you more about our puppies.",
  "Great question! Let me give you some details.",
  "Thanks for your interest! These puppies are from excellent health-tested parents.",
  "I appreciate your message. When would you like to schedule a visit?",
  "Thank you for considering our program. We have a few available spots.",
  "Happy to answer any questions you have about our breeding program!",
  "We'd love to have you visit! Our puppies are very well socialized.",
  "Thanks for the inquiry. I'll send over more photos soon.",
];

/**
 * Check if demo data has been seeded
 */
function isDemoSeeded(): boolean {
  try {
    return localStorage.getItem(DEMO_CONVERSATIONS_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Mark demo data as seeded
 */
function markDemoSeeded(): void {
  try {
    localStorage.setItem(DEMO_CONVERSATIONS_KEY, "true");
  } catch {
    // Ignore
  }
}

/**
 * Seed initial demo conversations if not already done
 */
export function seedDemoConversations(): void {
  if (isDemoSeeded()) {
    return;
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Conversation 1: Sunny Meadows Goldens (with unread reply)
  const conv1 = store.getOrCreateConversation({
    context: {
      type: "listing",
      programSlug: "sunny-meadows-goldens",
      programName: "Sunny Meadows Goldens",
      listingSlug: "spring-2024-litter",
      listingTitle: "Spring 2024 Golden Litter",
    },
    participant: {
      name: "Sunny Meadows Goldens",
      type: "breeder",
      slug: "sunny-meadows-goldens",
    },
  });

  // Add buyer message (from yesterday)
  store.sendMessage({
    conversationId: conv1.id,
    content: "Hi! I'm very interested in the Golden Retriever puppies. Are any females still available?",
    senderType: "buyer",
  });

  // Add breeder reply (unread)
  store.addBreederReply(
    conv1.id,
    "Yes, we have two females available! They're both beautiful and very sweet. Would you like to schedule a visit?"
  );

  // Conversation 2: Riverside German Shepherds (with unread reply)
  const conv2 = store.getOrCreateConversation({
    context: {
      type: "listing",
      programSlug: "riverside-shepherds",
      programName: "Riverside German Shepherds",
      listingSlug: "working-line-spring-24",
      listingTitle: "Working Line Spring 2024",
    },
    participant: {
      name: "Riverside German Shepherds",
      type: "breeder",
      slug: "riverside-shepherds",
    },
  });

  store.sendMessage({
    conversationId: conv2.id,
    content: "I'm looking for a working line GSD for protection training. Can you tell me more about the parents' temperament?",
    senderType: "buyer",
  });

  store.addBreederReply(
    conv2.id,
    "Both parents have excellent temperaments. The sire is titled in IPO and the dam has a natural protective instinct while being great with our kids."
  );

  // Conversation 3: Maple Leaf Doodles (general inquiry, no unread)
  const conv3 = store.getOrCreateConversation({
    context: {
      type: "general",
      programSlug: "maple-leaf-doodles",
      programName: "Maple Leaf Doodles",
    },
    participant: {
      name: "Maple Leaf Doodles",
      type: "breeder",
      slug: "maple-leaf-doodles",
    },
  });

  store.sendMessage({
    conversationId: conv3.id,
    content: "Do you have any upcoming litters planned? We're flexible on timing.",
    senderType: "buyer",
  });

  store.addBreederReply(
    conv3.id,
    "We have a litter due in May! These will be standard F1 Goldendoodles. Should I add you to our waitlist?"
  );

  store.sendMessage({
    conversationId: conv3.id,
    content: "Yes please! That sounds perfect.",
    senderType: "buyer",
  });

  // Mark conv3 as read (no unread messages)
  store.markConversationRead(conv3.id);

  // Conversation 4: Blue Ribbon Labs - Service inquiry
  const conv4 = store.getOrCreateConversation({
    context: {
      type: "service",
      serviceId: "svc-4",
      serviceName: "Early Puppy Training",
      programSlug: "blue-ribbon-labs",
      programName: "Blue Ribbon Labradors",
    },
    participant: {
      name: "Blue Ribbon Labradors",
      type: "service_provider",
      slug: "blue-ribbon-labs",
    },
  });

  store.sendMessage({
    conversationId: conv4.id,
    content: "I'm interested in the early puppy training program. How long is the program and what does it cover?",
    senderType: "buyer",
  });

  // This one stays without reply - waiting for response

  markDemoSeeded();
}

/**
 * Generate a random demo reply for testing
 */
export function generateDemoReply(): string {
  return DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
}

/**
 * Add random demo activity (replies to random conversations)
 */
export function generateDemoActivity(): number {
  const conversations = store.getConversations();
  if (conversations.length === 0) {
    return 0;
  }

  // Add 1-3 random replies
  const numReplies = Math.floor(Math.random() * 3) + 1;
  let added = 0;

  for (let i = 0; i < numReplies; i++) {
    const randomConv = conversations[Math.floor(Math.random() * conversations.length)];
    const reply = generateDemoReply();

    try {
      store.addBreederReply(randomConv.id, reply);
      added++;
    } catch {
      // Conversation might not have a breeder participant
    }
  }

  return added;
}

/**
 * Reset demo data (clear seeded flag so it can be re-seeded)
 */
export function resetDemoData(): void {
  try {
    localStorage.removeItem(DEMO_CONVERSATIONS_KEY);
    store.clearAllMessages();
  } catch {
    // Ignore
  }
}
