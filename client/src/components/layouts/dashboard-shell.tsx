"use client";

import {
  ReactNode,
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AppShell,
  Group,
  Text,
  Stack,
  Avatar,
  Menu,
  ActionIcon,
  UnstyledButton,
  Box,
  ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu as MenuIcon,
  Search,
  Settings,
  UserCircle,
  X,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import classes from "./NavbarSimple.module.css";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
}

function getUserLabel(user: any): string {
  if (!user) return "User";
  return (
    user.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email ||
    "User"
  );
}

function getUserInitials(user: any): string {
  const label = getUserLabel(user);
  return label
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DashboardShell({ children, navItems, title }: DashboardShellProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [opened, { toggle, close }] = useDisclosure();
  const [searchDraft, setSearchDraft] = useState("");
  const [searchPulse, setSearchPulse] = useState(false);
  const basePath = pathname?.split("/")[1] ? `/${pathname.split("/")[1]}` : "";
  const settingsPath = basePath ? `${basePath}/settings` : "/settings";
  const profilePath = `${settingsPath}?tab=profile`;
  const notificationPath = basePath
    ? `${basePath}/notification`
    : "/notification";
  const activeSearch = searchParams.get("search") ?? "";

  useEffect(() => {
    setSearchDraft(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    if (!searchPulse) return undefined;
    const timeoutId = window.setTimeout(() => setSearchPulse(false), 220);
    return () => window.clearTimeout(timeoutId);
  }, [searchPulse]);

  const applySearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = value.trim();

    if (normalized) {
      params.set("search", normalized);
    } else {
      params.delete("search");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearch(searchDraft);
    setSearchPulse(true);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchDraft("");
      applySearch("");
      setSearchPulse(true);
    }
  };

  const links = navItems.map((item) => {
    const IconComponent = item.icon;
    const isActive =
      pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        className={classes.link}
        data-active={isActive || undefined}
        href={item.href}
        key={item.title}
        onClick={close}
      >
        {IconComponent && (
          <IconComponent
            className={classes.linkIcon}
            size={22}
            strokeWidth={1.5}
          />
        )}
        <span>{item.title}</span>
      </Link>
    );
  });

  return (
    <AppShell
      layout="alt"
      header={{ height: 64 }}
      navbar={{
        width: 248,
        breakpoint: "md",
        collapsed: { mobile: !opened },
      }}
      className={classes.shell}
    >
      <AppShell.Navbar p="md" className={classes.navbar}>
        <div className={classes.navbarMain}>
          <Group className={classes.header} justify="space-between">
            <Group gap="sm" wrap="nowrap">
              <Box className={classes.brandMark}>
                <GraduationCap size={16} strokeWidth={2} />
              </Box>
              <Box>
                <Text className={classes.brandTitle}>PORTAL</Text>
              </Box>
            </Group>
            <Group gap="xs">
              <ActionIcon
                onClick={close}
                hiddenFrom="md"
                size="md"
                variant="subtle"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </ActionIcon>
            </Group>
          </Group>

          <div className={classes.navScroll}>
            <ScrollArea h="100%" offsetScrollbars>
              <Stack gap={4}>{links}</Stack>
            </ScrollArea>
          </div>
        </div>

        <div className={classes.footer}>
          <UnstyledButton
            className={`${classes.link} text-destructive hover:bg-destructive/10`}
            onClick={() => logout()}
            w="100%"
          >
            <LogOut className={classes.linkIcon} size={22} strokeWidth={1.5} />
            <span>Logout</span>
          </UnstyledButton>
        </div>
      </AppShell.Navbar>

      {/* HEADER */}
      <AppShell.Header className="border-b border-border bg-card px-4 md:px-6">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Group className={classes.headerLeft} wrap="nowrap">
            <ActionIcon
              onClick={toggle}
              hiddenFrom="md"
              size="md"
              variant="subtle"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Toggle sidebar"
            >
              <MenuIcon size={20} />
            </ActionIcon>
            <form
              className={`${classes.searchWrap} ${searchPulse ? classes.searchPulse : ""}`}
              onSubmit={handleSearchSubmit}
            >
              <input
                className={classes.searchInput}
                placeholder="Search..."
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.currentTarget.value)}
                onKeyDown={handleSearchKeyDown}
                aria-label={`Search ${title.toLowerCase()}`}
              />
              <button
                type="submit"
                className={classes.searchSubmit}
                aria-label={`Submit search for ${title.toLowerCase()}`}
              >
                <Search
                  className={classes.searchIcon}
                  size={14}
                  strokeWidth={1.8}
                />
              </button>
            </form>
          </Group>

          <Group gap="xs" className={classes.headerActions}>
            <Menu
              shadow="md"
              width={260}
              position="bottom-end"
              withinPortal={false}
              styles={{
                dropdown: {
                  width: "min(260px, calc(100vw - 1rem))",
                  maxWidth: "calc(100vw - 1rem)",
                  left: "auto",
                  right: 0,
                  backgroundColor: "#ffffff",
                  borderColor: "#e5e7eb",
                  borderRadius: "0.75rem",
                },
              }}
            >
              <Menu.Target>
                <UnstyledButton
                  className={classes.avatarButton}
                  aria-label="Open account menu"
                >
                  <Avatar radius="xl" size={24} className={classes.avatar}>
                    <span className="leading-none">
                      {getUserInitials(user)}
                    </span>
                  </Avatar>
                  <Text
                    size="sm"
                    fw={500}
                    className="hidden truncate text-foreground sm:block"
                  >
                    {getUserLabel(user)}
                  </Text>
                  <ChevronDown
                    size={14}
                    className="hidden shrink-0 text-muted-foreground sm:block"
                  />
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown className="bg-white text-foreground border-border">
                <Menu.Label className="text-muted-foreground">
                  Account
                </Menu.Label>
                <Box px="sm" py="xs">
                  <Text size="sm" fw={500} className="text-foreground">
                    {getUserLabel(user)}
                  </Text>
                  <Text size="xs" className="text-muted-foreground">
                    {user?.email}
                  </Text>
                </Box>
                <Menu.Divider className="border-border" />
                <Menu.Item
                  className="hover:bg-accent"
                  leftSection={<UserCircle size={14} />}
                  onClick={() => router.push(profilePath)}
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  className="hover:bg-accent"
                  leftSection={<Settings size={14} />}
                  onClick={() => router.push(settingsPath)}
                >
                  Settings
                </Menu.Item>
                <Menu.Item
                  className="hover:bg-accent"
                  leftSection={<Bell size={14} />}
                  onClick={() => router.push(notificationPath)}
                >
                  Notifications
                </Menu.Item>
                <Menu.Item
                  className="text-destructive hover:bg-destructive/10"
                  leftSection={<LogOut size={14} />}
                  onClick={logout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <NotificationsDropdown />
          </Group>
        </Group>
      </AppShell.Header>

      {/* MAIN CONTENT AREA */}
      <AppShell.Main className={classes.main}>
        <div className={classes.mainContainer}>{children}</div>
      </AppShell.Main>
    </AppShell>
  );
}

export default DashboardShell;
export { DashboardShell };
