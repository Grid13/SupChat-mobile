import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CreateChannelModal from "./CreateChannelModal";

export type Channel = {
  id: number;
  name: string;
  icon?: string;
  unread?: number;
  visibility?: string;
  visibilityLocalized?: string;
  workspaceId?: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onChannelPress?: (ch: Channel) => void;
  workspaceId: number;
  workspaceName: string;
  channels: Channel[];
  loading: boolean;
  selectedChannelId?: number | null;
  onChannelCreated?: () => void; // <--- nouveau callback
};

const WorkspaceDrawer: React.FC<Props> = ({
  visible,
  onClose,
  onChannelPress,
  workspaceId,
  workspaceName,
  channels,
  loading,
  selectedChannelId,
  onChannelCreated,
}) => {
  const [createModalVisible, setCreateModalVisible] = useState(false);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.drawer}>
        {/* Workspace info */}
        <View style={styles.workspaceInfo}>
          <Image
            source={{
              uri:
                "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=80&h=80",
            }}
            style={styles.workspaceAvatar}
          />
          <View>
            <Text style={styles.workspaceName}>{workspaceName}</Text>
            <TouchableOpacity style={styles.settingsIcon}>
              <Ionicons name="settings-sharp" size={16} color="#888" />
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.channelsTitle}>Channels</Text>
        <ScrollView style={{ flex: 1 }}>
          {loading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : channels.length === 0 ? (
            <Text style={{ color: "#aaa", marginTop: 12 }}>No channels found.</Text>
          ) : (
            channels.map((ch: Channel) => (
              <TouchableOpacity
                key={ch.id}
                style={[
                  styles.channelRow,
                  ch.id === selectedChannelId && { backgroundColor: "#e7f1ff" },
                ]}
                onPress={() => onChannelPress?.(ch)}
              >
                <Ionicons
                  name={(ch.icon as any) || "chatbubbles-outline"}
                  size={20}
                  style={{ marginRight: 6 }}
                  color={ch.id === selectedChannelId ? "#4F8CFF" : "#222"}
                />
                <Text
                  style={[
                    styles.channelName,
                    ch.id === selectedChannelId && styles.activeChannel,
                  ]}
                >
                  {ch.name}
                </Text>
                {ch.unread && ch.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{ch.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}

          {/* Add Channel button TOUJOURS à la fin de la liste */}
          <TouchableOpacity
            style={styles.addChannelBtn}
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#4F8CFF" />
            <Text style={styles.addChannelText}>Add Channel</Text>
          </TouchableOpacity>
        </ScrollView>

        <CreateChannelModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          workspaceId={workspaceId}
          onCreated={() => {
            setCreateModalVisible(false);
            if (onChannelCreated) onChannelCreated();
          }}
        />
      </View>
      <TouchableOpacity style={styles.closeArea} onPress={onClose} activeOpacity={1} />
    </View>
  );
};

export default WorkspaceDrawer;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0005",
    zIndex: 1000,
  },
  drawer: {
    width: 300,
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  workspaceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  workspaceAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  workspaceName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  settingsIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  settingsText: {
    fontSize: 13,
    color: "#888",
    marginLeft: 2,
  },
  channelsTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 10,
    marginTop: 8,
    color: "#444",
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 5,
    borderRadius: 8,
    marginBottom: 3,
  },
  channelName: {
    fontSize: 15,
    color: "#222",
  },
  activeChannel: {
    color: "#4F8CFF",
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: "#4F8CFF",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 7,
    minWidth: 18,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  addChannelBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 7,
    backgroundColor: "#f3f7ff",
    borderWidth: 1,
    borderColor: "#e3e8f5",
    alignSelf: "center",
    width: "94%",
  },
  addChannelText: {
    color: "#4F8CFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 15,
  },
  closeArea: {
    flex: 1,
  },
});
