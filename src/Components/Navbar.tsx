import React from "react";
import { Anchor, Header, Text, Nav } from "grommet";
import { Github, Twitter } from "grommet-icons";
import pulseBPM1 from "../src/pulseBPM1.png";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <React.Fragment>
      <Header className="navbar-main" background="darkBlue" pad="small">
        <Text>
          pulse<span style={{ color: "#f062a9" }}>BPM</span>
        </Text>
        <Nav direction="row" justify="around">
          <Anchor color="light-1" href="https://ljwhite.is">
            ljwhite.is
          </Anchor>
          <Anchor href="https://github.com/theljwhite">
            <Github color="light-1" />
          </Anchor>
          <Anchor href="https://twitter.com/theLJWhite">
            <Twitter color="light-1" />
          </Anchor>{" "}
        </Nav>
      </Header>
    </React.Fragment>
  );
}
