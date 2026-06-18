import { Container, SimpleGrid, Text } from "@mantine/core";
import type { ReactNode } from "react";

import { BrandMark, CheckIcon } from "../../shared/ui/icons";

const FEATURES = [
  "Автопроверяемый тренажёр по реальным кейсам",
  "ИИ-наставник с опорой на стандарты",
  "Сертификат «ВТБ × МСФО»",
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Container size="lg" mt={{ base: "md", sm: "xl" }} px={0}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" className="vtb-rise">
        <aside className="vtb-auth-aside" style={{ display: "flex" }} data-hide-mobile>
          <img className="vtb-auth-aside__image" src="/brand/auth-aside.png" alt="" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="vtb-auth-brand">
              <BrandMark size={30} />
              <span>Образование</span>
            </div>
            <Text fz={11} fw={700} mt="lg" style={{ letterSpacing: "0.16em", opacity: 0.8 }}>
              ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА
            </Text>
            <Text fz={28} fw={800} mt={6} mb="sm" style={{ lineHeight: 1.15 }}>
              Профессиональная практика МСФО
            </Text>
            <Text fz={15} style={{ opacity: 0.88, maxWidth: 360 }}>
              Практика-первый формат: решайте реальные кейсы в тренажёре, а не смотрите
              лекции. Растите компетенцию и доход.
            </Text>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            {FEATURES.map((f) => (
              <div className="vtb-auth-feat" key={f}>
                <span>
                  <CheckIcon size={16} color="#fff" />
                </span>
                {f}
              </div>
            ))}
          </div>
        </aside>
        <div>{children}</div>
      </SimpleGrid>
    </Container>
  );
}
