import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
import { signinInput, signupInput } from "@shivtiwari/serverless-blog-common";

const app = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    };
}>();

app.post("/signup", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = signupInput.safeParse(body);

    if (!success) {
        c.status(400);
        return c.json({
            msg: "invalid signup schema",
        });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: body.email,
            },
        });

        if (existingUser) {
            return c.json({ message: "user already exists, try signin in" });
        } else {
            const hashedPassword = bcrypt.hashSync(
                body.password.toString(),
                10
            );

            const user = await prisma.user.create({
                data: {
                    firstName: body.firstName,
                    lastName: body.lastName,
                    email: body.email,
                    password: hashedPassword,
                },
            });

            const token = await sign(
                {
                    id: user.id,
                },
                c.env.JWT_SECRET
            );

            console.log(user);

            return c.json({
                token,
            });
        }
    } catch (e) {
        console.log(e);
        return c.json({ message: "some error occurred" });
    }
});

app.post("/signin", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);

    if (!success) {
        c.status(400);
        return c.json({
            msg: "invalid signin schema",
        });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: body.email,
            },
        });

        if (user) {
            const isCorrectPassword = bcrypt.compareSync(
                body.password,
                user!!.password
            );

            if (isCorrectPassword) {
                const token = await sign({ id: user!!.id }, c.env.JWT_SECRET);
                return c.json({ token });
            } else {
                return c.json({ message: "invalid credentials" });
            }
        }
    } catch (e) {
        console.log(e);
        return c.text("user does not exist, try signin up first");
    }
});

export default app;
