/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button } from "@chakra-ui/button";
import { Stack, Text, VStack } from "@chakra-ui/layout";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
} from "@chakra-ui/modal";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import ModalCloseButton from "../common/ModalCloseButton";
import HlsVideoEmbed, { HlsVideo } from "../common/HlsVideoEmbed";
import editorConfigSnapshot from "../documentation/cms-snapshot/editor-config.json";
import { useLogging } from "../logging/logging-hooks";
import { useSettings } from "../settings/settings";

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeDialog = ({ isOpen, onClose }: WelcomeDialogProps) => {
  const [welcomeVideo, setWelcomeVideo] = useState<HlsVideo | undefined>();
  const [loadError, setLoadError] = useState<boolean>(false);
  const [{ languageId }] = useSettings();
  const logging = useLogging();
  useEffect(() => {
    const snapshot = editorConfigSnapshot as any;
    const video = snapshot?.[0]?.welcomeVideo as HlsVideo | undefined;
    if (video?.src) {
      setWelcomeVideo(video);
    } else {
      logging.error("Welcome video missing from editor-config snapshot");
      setLoadError(true);
    }
  }, [languageId, logging]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay>
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <VStack p={5} pb={0} spacing={5} alignItems="stretch">
              <Stack spacing={3}>
                <Text as="h2" fontSize="xl" fontWeight="semibold">
                  <FormattedMessage id="welcome-title" />
                </Text>
                {loadError ? (
                  <Text>
                    <FormattedMessage id="content-load-error" />
                  </Text>
                ) : (
                  <HlsVideoEmbed video={welcomeVideo} />
                )}
              </Stack>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="center" pt={4}>
            <Button size="lg" variant="solid" onClick={onClose}>
              <FormattedMessage id="start-coding-action" />
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default WelcomeDialog;
