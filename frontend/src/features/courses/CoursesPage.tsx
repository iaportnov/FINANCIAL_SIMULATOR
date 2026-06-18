import { Card, Center, Container, Group, Image, Loader, SimpleGrid, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { TrainerIcon } from "../../shared/ui/icons";
import { fetchCourses } from "./api";

const COURSE_IMAGES: Record<string, string> = {
  "personal-finance-basics": "/courses/personal-finance-basics.png",
};

export function CoursesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });

  if (isLoading)
    return (
      <Center mih="60vh">
        <Loader />
      </Center>
    );

  return (
    <Container size="md" px={0}>
      <Title order={2} mb={4}>
        Программы
      </Title>
      <Text c="dimmed" mb="xl">
        Модульная библиотека стандартов МСФО. Выберите программу и продолжайте на карте.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" className="vtb-stagger">
        {data?.items.map((course) => (
          <Card
            key={course.id}
            withBorder
            component={Link}
            to="/"
            style={{ textDecoration: "none", color: "inherit", transition: "transform .16s, box-shadow .16s" }}
            className="vtb-card-hover"
          >
            {COURSE_IMAGES[course.slug] ? (
              <Card.Section>
                <Image src={COURSE_IMAGES[course.slug]} alt="" h={160} fit="cover" />
              </Card.Section>
            ) : null}
            <Group justify="space-between" mt={COURSE_IMAGES[course.slug] ? "md" : 0} mb="sm">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--vtb-gradient-soft)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <TrainerIcon size={24} color="#fff" />
              </div>
              <ArrowGlyph />
            </Group>
            <Title order={4}>{course.title}</Title>
            <Text c="dimmed" fz="sm" mt={4}>
              {course.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden>
      <path
        d="M5 12h14m0 0-6-6m6 6-6 6"
        stroke="var(--vtb-blue)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
