import { Card, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchCourses } from "./api";

export function CoursesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["courses"], queryFn: fetchCourses });

  if (isLoading) return <Text>Загрузка…</Text>;

  return (
    <Stack>
      <Title order={2}>Курсы</Title>
      {data?.items.map((course) => (
        <Card key={course.id} withBorder component={Link} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Title order={4}>{course.title}</Title>
          <Text c="dimmed">{course.description}</Text>
        </Card>
      ))}
    </Stack>
  );
}
