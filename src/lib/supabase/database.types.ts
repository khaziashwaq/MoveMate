export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string;
          phone: string | null;
          location: string | null;
          is_verified: boolean;
          is_banned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string;
          phone?: string | null;
          location?: string | null;
          is_verified?: boolean;
          is_banned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string;
          phone?: string | null;
          location?: string | null;
          is_verified?: boolean;
          is_banned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          listing_type: Database["public"]["Enums"]["listing_type"];
          title: string;
          description: string;
          price: number;
          currency: string;
          category: Database["public"]["Enums"]["listing_category"];
          condition: Database["public"]["Enums"]["listing_condition"];
          status: Database["public"]["Enums"]["listing_status"];
          location: string;
          latitude: number | null;
          longitude: number | null;
          is_negotiable: boolean;
          is_delivery: boolean;
          rent_per_week: number | null;
          bond: number | null;
          available_from: string | null;
          lease_end: string | null;
          room_type: string | null;
          preferred_gender: string | null;
          current_occupants: number | null;
          total_rooms: number | null;
          furnished: boolean | null;
          bills_included: boolean | null;
          parking: boolean | null;
          pets_allowed: boolean | null;
          view_count: number;
          fts: unknown | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          listing_type?: Database["public"]["Enums"]["listing_type"];
          title: string;
          description: string;
          price: number;
          currency?: string;
          category: Database["public"]["Enums"]["listing_category"];
          condition: Database["public"]["Enums"]["listing_condition"];
          status?: Database["public"]["Enums"]["listing_status"];
          location: string;
          latitude?: number | null;
          longitude?: number | null;
          is_negotiable?: boolean;
          is_delivery?: boolean;
          rent_per_week?: number | null;
          bond?: number | null;
          available_from?: string | null;
          lease_end?: string | null;
          room_type?: string | null;
          preferred_gender?: string | null;
          current_occupants?: number | null;
          total_rooms?: number | null;
          furnished?: boolean | null;
          bills_included?: boolean | null;
          parking?: boolean | null;
          pets_allowed?: boolean | null;
          view_count?: number;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          listing_type?: Database["public"]["Enums"]["listing_type"];
          title?: string;
          description?: string;
          price?: number;
          currency?: string;
          category?: Database["public"]["Enums"]["listing_category"];
          condition?: Database["public"]["Enums"]["listing_condition"];
          status?: Database["public"]["Enums"]["listing_status"];
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
          is_negotiable?: boolean;
          is_delivery?: boolean;
          rent_per_week?: number | null;
          bond?: number | null;
          available_from?: string | null;
          lease_end?: string | null;
          room_type?: string | null;
          preferred_gender?: string | null;
          current_occupants?: number | null;
          total_rooms?: number | null;
          furnished?: boolean | null;
          bills_included?: boolean | null;
          parking?: boolean | null;
          pets_allowed?: boolean | null;
          view_count?: number;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          url: string;
          storage_path: string;
          position: number;
          width: number | null;
          height: number | null;
          size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          url: string;
          storage_path: string;
          position?: number;
          width?: number | null;
          height?: number | null;
          size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          url?: string;
          storage_path?: string;
          position?: number;
          width?: number | null;
          height?: number | null;
          size_bytes?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_listings: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          listing_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_listings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_listings_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: Database["public"]["Enums"]["report_target_type"];
          target_id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          description: string | null;
          status: Database["public"]["Enums"]["report_status"];
          moderator_id: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: Database["public"]["Enums"]["report_target_type"];
          target_id: string;
          reason: Database["public"]["Enums"]["report_reason"];
          description?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          moderator_id?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: Database["public"]["Enums"]["report_target_type"];
          target_id?: string;
          reason?: Database["public"]["Enums"]["report_reason"];
          description?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          moderator_id?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_moderator_id_fkey";
            columns: ["moderator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_listings: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          title: string;
          description: string;
          address: string;
          landmark: string | null;
          rent: string;
          deposit: string | null;
          brokerage: string | null;
          available_from: string | null;
          features: string[] | null;
          flatmate_info: string | null;
          preferences: string | null;
          contact: string | null;
          lat: number;
          lng: number;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          title: string;
          description?: string;
          address: string;
          landmark?: string | null;
          rent: string;
          deposit?: string | null;
          brokerage?: string | null;
          available_from?: string | null;
          features?: string[] | null;
          flatmate_info?: string | null;
          preferences?: string | null;
          contact?: string | null;
          lat: number;
          lng: number;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          title?: string;
          description?: string;
          address?: string;
          landmark?: string | null;
          rent?: string;
          deposit?: string | null;
          brokerage?: string | null;
          available_from?: string | null;
          features?: string[] | null;
          flatmate_info?: string | null;
          preferences?: string | null;
          contact?: string | null;
          lat?: number;
          lng?: number;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string | null;
          buyer_id: string | null;
          seller_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string | null;
          buyer_id?: string | null;
          seller_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "user_listings";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string | null;
          content?: string;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      increment_view_count: {
        Args: { listing_uuid: string };
        Returns: undefined;
      };
      get_listing_save_count: {
        Args: { listing_uuid: string };
        Returns: number;
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string };
        Returns: number;
      };
      get_my_conversations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          listing_id: string | null;
          buyer_id: string | null;
          seller_id: string | null;
          created_at: string;
          last_message_content: string | null;
          last_message_at: string | null;
          last_message_sender_id: string | null;
          unread_count: number;
        }[];
      };
      get_unread_message_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      listing_type:
        | "furniture"
        | "flatmate_wanted"
        | "flatmate_replacement"
        | "room_available";
      listing_status:
        | "draft"
        | "active"
        | "sold"
        | "reserved"
        | "expired"
        | "removed";
      listing_category:
        | "sofa"
        | "bed"
        | "table"
        | "chair"
        | "desk"
        | "storage"
        | "lighting"
        | "appliance"
        | "decor"
        | "outdoor"
        | "other";
      listing_condition: "new" | "like_new" | "good" | "fair" | "poor";
      report_reason:
        | "spam"
        | "scam"
        | "inappropriate_content"
        | "misleading"
        | "duplicate"
        | "prohibited_item"
        | "harassment"
        | "other";
      report_status: "pending" | "reviewing" | "resolved" | "dismissed";
      report_target_type: "listing" | "profile";
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};
