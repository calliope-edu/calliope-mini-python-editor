import {
  Button,
  Flex,
  HStack,
  Icon,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { ReactNode, useState } from "react";
import { IconType } from "react-icons";
import {
  RiFile3Line,
  RiLayoutMasonryFill,
  RiSettings2Line,
  RiCloudLine,
  RiFlashlightFill,
} from "react-icons/ri";
import Placeholder from "../common/Placeholder";
import Packages from "./Packages";
import SidePanelTabContent from "./LeftPanelTabContent";

interface Panel {
  id: string;
  icon: IconType;
  title: string;
  contents: ReactNode;
}

interface PanelsProps {
  panels: Panel[];
}

const SidePanel = () => {
  const panels: Panel[] = [
    {
      id: "packages",
      title: "Packages",
      icon: RiLayoutMasonryFill,
      contents: <Packages />,
    },
    {
      id: "files",
      title: "Files",
      icon: RiFile3Line,
      contents: <Placeholder />,
    },
    {
      id: "cloud",
      title: "Cloud",
      icon: RiCloudLine,
      contents: <Placeholder />,
    },
    {
      id: "settings",
      title: "Settings",
      icon: RiSettings2Line,
      contents: <Placeholder />,
    },
  ];
  return <Panels panels={panels} />;
};

const Panels = ({ panels }: PanelsProps) => {
  const [connected, setConnected] = useState(false);
  return (
    <Flex height="100%" direction="column">
      <Tabs orientation="vertical" size="lg" variant="line" flex="1 0 auto">
        <TabList height="100%" backgroundColor="whitesmoke">
          {panels.map((p) => (
            <Tab key={p.id}>
              <Icon as={p.icon} aria-label={p.title} />
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {panels.map((p) => (
            <TabPanel key={p.id} p={0} height="100%">
              <SidePanelTabContent title={p.title}>
                {p.contents}
              </SidePanelTabContent>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
      <VStack flex="0 0 auto" background="rgb(47, 196, 47, 0.2)" padding={5}>
        <HStack as="label" spacing={2}>
          <Text as="span" size="lg" fontWeight="bold">
            Connect
          </Text>
          <Switch
            size="lg"
            checked={connected}
            onChange={() => setConnected(!connected)}
          />
        </HStack>
        <Button leftIcon={<RiFlashlightFill />} size="lg" disabled={!connected}>
          Flash micro:bit
        </Button>
      </VStack>
    </Flex>
  );
};

export default SidePanel;
