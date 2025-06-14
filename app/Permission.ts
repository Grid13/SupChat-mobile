const optionsSections = [
  {
    title: "Administrator",
    options: [
      {
        key: "administrator",
        label: "Administrator",
        description: "Users have all the rights.",
        permission: 134,
      },
    ],
  },
  {
    title: "Defaults",
    options: [
      {
        key: "viewChannels",
        label: "View channels",
        description: "Users can view all public channels.",
        permission: 22,
      },
      {
        key: "viewMessages",
        label: "View messages",
        description:
          "Users can read messages in any channel they have access to.",
        permission: 57,
      },
      {
        key: "sendMessages",
        label: "Send messages",
        description:
          "Users can send messages in any channel they have access to.",
        permission: 59,
      },
      {
        key: "viewAttachments",
        label: "View attachments",
        description:
          "Users can view files shared in any channel they have access to.",
        permission: 8,
      },
      {
        key: "sendAttachments",
        label: "Send attachments",
        description: "Users can send files in any channel they have access to.",
        permission: 10,
      },
      {
        key: "viewReactions",
        label: "View reactions",
        description:
          "Users can see emoji reactions in any channel they have access to.",
        permission: 85,
      },
      {
        key: "sendReactions",
        label: "Send reactions",
        description:
          "Users can react to messages with emojis in any channel they have access to.",
        permission: 87,
      },
    ],
  },
  {
    title: "Workspace",
    options: [
      {
        key: "manageWorkspace",
        label: "Manage workspace",
        description: "Users can edit or delete the workspace.",
        permission: 109,
      },
    ],
  },
  {
    title: "Channels",
    options: [
      {
        key: "manageChannels",
        label: "Manage invitations",
        description: "Users can create, edit, or delete channels.",
        permission: [24, 25, 26],
      },
      {
        key: "viewChannelsMembers",
        label: "View channels members",
        description:
          "Users can view all users in any channel they have access to.",
        permission: 29,
      },
      {
        key: "manageChannelsMembers",
        label: "Manage channels members",
        description:
          "Users can add or remove members from any channel they have access to.",
        permission: [31, 32, 33],
      },
    ],
  },
  {
    title: "Messages",
    options: [
      {
        key: "manageMessages",
        label: "Manage messages",
        description:
          "Users can edit or delete messages in any channel they have access to.",
        permission: [60, 61],
      },
    ],
  },
  {
    title: "Attachments",
    options: [
      {
        key: "manageAttachments",
        label: "Manage attachments",
        description:
          "Users can edit or delete files in any channel they have access to.",
        permission: [11, 12],
      },
    ],
  },
  {
    title: "Invitations",
    options: [
      {
        key: "viewInvitations",
        label: "View invitations",
        description:
          "Users can view all pending invitations to join the workspace.",
        permission: 50,
      },
      {
        key: "sendInvitations",
        label: "Send invitations",
        description: "Users can invite others to join the workspace.",
        permission: 52,
      },
      {
        key: "manageInvitations",
        label: "Manage invitations",
        description:
          "Users can edit or delete pending invitations to join the workspace.",
        permission: [53, 54],
      },
    ],
  },
  {
    title: "Roles",
    options: [
      {
        key: "viewRoles",
        label: "View all roles",
        description: "Users can view all roles in the workspace.",
        permission: 127,
      },
      {
        key: "viewUsersRoles",
        label: "View users roles",
        description: "Users can view the assigned roles of other users.",
        permission: 99,
      },
      {
        key: "assignRoles",
        label: "Assign roles",
        description: "Users can assign roles to other users.",
        permission: 101,
      },
      {
        key: "unassignRoles",
        label: "Unassign roles",
        description: "Users can remove roles from other users.",
        permission: 103,
      },
      {
        key: "manageRoles",
        label: "Manage roles",
        description:
          "Users can create, edit, or delete roles in the workspace.",
        permission: [129, 130, 131],
      },
    ],
  },
];

export default optionsSections;
