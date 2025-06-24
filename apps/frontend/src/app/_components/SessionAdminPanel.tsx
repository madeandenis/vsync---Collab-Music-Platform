import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { TbTableOptions } from "react-icons/tb";
import { Backdrop } from "./Backdrop";
import ToggleSwitch from "./buttons/ToggleSwitchButton";
import { GroupSession } from "@frontend/shared";
import { useAlertContext } from "../contexts/alertContext";
import Slider from "./sliders/Slider";
import { modifyGroupSessionSettings } from "../_api/groupsSessionApi";

interface DOMRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface AdminPanelProps {
  session: GroupSession;
  setSession: (groupSession: GroupSession) => void;
}

const defaultSettings = {
  maxParticipants: 10,
  votingMode: 'upvote-only',
  queueMode: 'host-only',
  playbackMode: 'hierarchical',
} as GroupSession['settings'];

export default function SessionAdminPanel({
  session,
  setSession,
}: AdminPanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const { setAlert } = useAlertContext();

  const [sessionSettings, setSessionSettings] = useState<GroupSession['settings']>(() => {
    const settings = session?.settings;
    return (settings && Object.keys(settings).length > 0)
      ? { ...settings }
      : defaultSettings;
  });

  const togglePanelVisibility = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!isPanelOpen) {
      const buttonElement = e.currentTarget;
      const rect = buttonElement.getBoundingClientRect();
      setButtonRect(rect);
    }
    setIsPanelOpen((prev) => !prev);
  };

  const getPanelPosition = () => {
    if (!buttonRect) return {};

    const offset = 6;
    const verticalOffset = offset + buttonRect.height / 2;

    return {
      top: `${buttonRect.top - verticalOffset}px`,
      left: `calc(50% - ${offset}px)`,
      transform: "translateX(-50%)",
    };
  };

  // Select change handlers
  const handleVotingSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSessionSettings(prev => ({
      ...prev,
      votingMode: e.target.value as GroupSession["settings"]["votingMode"]
    }));
  };

  const handleQueueManagementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSessionSettings(prev => ({
      ...prev,
      queueMode: e.target.value as GroupSession["settings"]["queueMode"]
    }));
  };

  const handlePlaybackControlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSessionSettings(prev => ({
      ...prev,
      playbackMode: e.target.value as GroupSession["settings"]["playbackMode"]
    }));
  };

  const handleMaxParticipantsChange = (value: number) => {
    setSessionSettings(prev => ({
      ...prev,
      maxParticipants: value
    }));
  };

  const toggleVoteSystemEnabled = () => {
    setSessionSettings(prev => ({
      ...prev,
      isVoteSystemEnabled: !prev.isVoteSystemEnabled
    }));
  };

  const toggleQueueReorderingEnabled = () => {
    setSessionSettings(prev => ({
      ...prev,
      isQueueReorderingEnabled: !prev.isQueueReorderingEnabled
    }));
  };

  type ModifySettingsInput = {
    groupId: string;
    sessionSettings: GroupSession['settings'];
  };

  const modifySettingsMutation = useMutation({
    mutationFn: ({ groupId, sessionSettings }: ModifySettingsInput) =>
      modifyGroupSessionSettings(groupId, sessionSettings),
    onMutate: () => setIsLoading(true),
    onSuccess: (groupSession) => {
      setIsPanelOpen(false);
      setSession(groupSession);
    },
    onError: (error: Error) => {
      setAlert(error, 'error', 1500);
    },
    onSettled() {
      setIsLoading(false);
    },
  });

  const handleSubmit = () => modifySettingsMutation.mutate({ groupId: session.groupId, sessionSettings })

  const handleCancel = () => {
    setIsPanelOpen(false);
  }

  return (
    <div className="relative">
      {/* Button to toggle panel visibility */}
      <div
        className="p-1.5 bg-white/10 rounded-xl cursor-pointer z-50 relative"
        onClick={togglePanelVisibility}
      >
        <TbTableOptions className="text-white/70" size={26} />
      </div>

      {/* Fullscreen Overlay */}
      {isPanelOpen && buttonRect && (
        <Backdrop opacity={30} zIndex={40}>
          <div
            className="absolute mx-auto w-[90%] max-w-xl rounded-xl bg-charcoalBlack p-1 sm:6 font-nunito"
            style={getPanelPosition()}
          >
            <h1 className="text-white text-xl mt-6 ml-4">Session Settings</h1>

            <div className="mt-6 p-4 my-6 space-y-6 border border-1 border-white/20 rounded-xl">
              {/* Vote Button Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Show Vote Buttons</p>
                  <p className="text-white/60 text-sm">Allow users to vote on tracks</p>
                </div>
                <ToggleSwitch
                  isOn={sessionSettings.isVoteSystemEnabled}
                  handleToggle={toggleVoteSystemEnabled}
                  offColor="bg-graphite"
                />
              </div>

              {/* Queue Reordering Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Allow Queue Reordering</p>
                  <p className="text-white/60 text-sm">Let users rearrange the queue</p>
                </div>
                <ToggleSwitch
                  isOn={sessionSettings.isQueueReorderingEnabled}
                  handleToggle={toggleQueueReorderingEnabled}
                  offColor="bg-graphite"
                />
              </div>

              {/* Session Settings Form*/}

              {/* Voting System Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Voting System</p>
                  <p className="text-white/60 text-sm">Choose how users can vote</p>
                </div>
                <select
                  className="bg-graphite text-white rounded-md p-1 text-sm"
                  value={sessionSettings.votingMode}
                  onChange={handleVotingSystemChange}
                  disabled={isLoading}
                >
                  <option value="upvote-only">Upvote Only</option>
                  <option value="upvote-downvote">Upvote & Downvote</option>
                </select>
              </div>

              {/* Queue Management Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Queue Management</p>
                  <p className="text-white/60 text-sm">Who can manage the queue?</p>
                </div>
                <select
                  className="bg-graphite text-white rounded-md p-1 text-sm"
                  value={sessionSettings.queueMode}
                  onChange={handleQueueManagementChange}
                  disabled={isLoading}
                >
                  <option value="collaborative">Collaborative</option>
                  <option value="host-only">Host Only</option>
                </select>
              </div>

              {/* Playback Control Selector */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Playback Control</p>
                  <p className="text-white/60 text-sm">Who can control playback?</p>
                </div>
                <select
                  className="bg-graphite text-white rounded-md p-1 text-sm"
                  value={sessionSettings.playbackMode}
                  onChange={handlePlaybackControlChange}
                  disabled={isLoading}
                >
                  <option value="equal">Equal</option>
                  <option value="hierarchical">Host Priority</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Max Participants</p>
                  <p className="text-white/60 text-sm">
                    Limit: {sessionSettings.maxParticipants} {sessionSettings.maxParticipants === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <Slider
                  min={1}
                  max={50}
                  value={sessionSettings.maxParticipants}
                  onChange={(e) => handleMaxParticipantsChange(Number(e.target.value))}
                  className="w-40"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-1 pt-1">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="text-sm px-4 py-2 text-white/80 bg-transparent rounded-lg hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="text-sm px-4 py-2 text-white bg-spotifyGreen rounded-lg hover:bg-spotifyGreen/80 transition disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </Backdrop>
      )}
    </div>
  );
}