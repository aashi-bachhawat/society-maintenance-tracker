"""
Creates (or resets the password of) an admin user.

Usage:
    python seed_admin.py admin@society.com "Admin Name" "SecurePass123"

Run this once after setting up the database to get your first admin login,
since public registration only ever creates resident accounts.
"""
import sys
from app.database import SessionLocal, Base, engine
from app import models, auth

Base.metadata.create_all(bind=engine)


def main():
    if len(sys.argv) != 4:
        print('Usage: python seed_admin.py <email> "<name>" "<password>"')
        sys.exit(1)

    email, name, password = sys.argv[1], sys.argv[2], sys.argv[3]
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user.password_hash = auth.hash_password(password)
            user.role = models.UserRole.admin
            user.name = name
            db.commit()
            print(f"Updated existing user {email} to admin with new password.")
        else:
            user = models.User(
                name=name,
                email=email,
                password_hash=auth.hash_password(password),
                role=models.UserRole.admin,
            )
            db.add(user)
            db.commit()
            print(f"Created admin user {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
