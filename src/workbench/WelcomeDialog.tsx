/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Button } from "@chakra-ui/button";
import { HStack, Link, Stack, Text, VStack } from "@chakra-ui/layout";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
} from "@chakra-ui/modal";
import { Icon } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";
import { RiExternalLinkLine } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import ModalCloseButton from "../common/ModalCloseButton";
import editorConfigSnapshot from "../documentation/cms-snapshot/editor-config.json";
import YoutubeVideoEmbed, { YoutubeVideo } from "../common/YoutubeVideoEmbed";
import { useDeployment } from "../deployment";
import { useLogging } from "../logging/logging-hooks";
import { useSettings } from "../settings/settings";

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeDialog = ({ isOpen, onClose }: WelcomeDialogProps) => {
  const { guideLink } = useDeployment();
  const [welcomeVideo, setWelcomeVideo] = useState<YoutubeVideo | undefined>();
  const [loadError, setLoadError] = useState<boolean>(false);
  const [{ languageId }] = useSettings();
  const logging = useLogging();
  useEffect(() => {
    const snapshot = editorConfigSnapshot as any;
    const video = snapshot?.[0]?.welcomeVideo as YoutubeVideo | undefined;
    if (video) {
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
            <VStack
              width="auto"
              ml="auto"
              mr="auto"
              p={5}
              pb={0}
              spacing={5}
              alignItems="stretch"
            >
              <Stack spacing={3}>
                <Text as="h2" fontSize="xl" fontWeight="semibold">
                  <FormattedMessage id="welcome-title" />
                </Text>
                {loadError ? (
                  <Text>
                    <FormattedMessage id="content-load-error" />
                  </Text>
                ) : (
                  <YoutubeVideoEmbed youTubeVideo={welcomeVideo} />
                )}
              </Stack>
              <Text>
                <FormattedMessage id="welcome-message" />
              </Text>
              <Text>
                <FormattedMessage
                  id="guide-link"
                  values={{
                    link: (chunks: ReactNode) => (
                      <Link
                        color="brand.500"
                        target="_blank"
                        rel="noreferrer"
                        href={guideLink}
                      >
                        {chunks}{" "}
                        <Icon as={RiExternalLinkLine} verticalAlign="middle" />
                      </Link>
                    ),
                  }}
                />
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2.5}>
              <Button size="lg" variant="solid" onClick={onClose}>
                <FormattedMessage id="start-coding-action" />
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
};

export default WelcomeDialog;
