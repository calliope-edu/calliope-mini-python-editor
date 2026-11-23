/**
 * (c) 2026, Calliope gGmbH and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import {
  BuildInfo,
  buildInfo as defaultBuildInfo,
  packagesLine,
  versionLine,
} from "../build-info";

interface BuildInfoLineProps {
  info?: BuildInfo;
}

/**
 * The build's version below the help menu's last separator, as every Calliope
 * editor shows it: live "calliope-v1.0.0 · 7ea9962", dev a framed "dev" mark
 * and "calliope-main · a1b2c3d", and a second line with the calliope-ui and
 * widget states in editors that carry them.
 */
const BuildInfoLine = ({ info = defaultBuildInfo }: BuildInfoLineProps) => {
  const packages = packagesLine(info);
  return (
    <VStack
      data-testid="build-info"
      alignItems="flex-start"
      spacing={0}
      px={3}
      py={1}
      color="black"
      fontSize="xs"
      userSelect="text"
    >
      <HStack spacing={2}>
        {info.channel !== "live" && (
          <Box
            as="span"
            border="1px solid"
            borderColor="black"
            borderRadius="sm"
            px={1}
            lineHeight="short"
          >
            {info.channel}
          </Box>
        )}
        <Text as="span">{versionLine(info)}</Text>
      </HStack>
      {packages && <Text as="span">{packages}</Text>}
    </VStack>
  );
};

export default BuildInfoLine;
